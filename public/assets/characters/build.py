import json, struct, math, os, numpy as np
OUT=os.path.dirname(__file__)

def make(variant):
    idx=int(variant.split('_')[1]); skin_idx=idx%6; outfit_idx=(idx//6)%4
    buf=bytearray(); views=[]; access=[]
    def add(data, typ, component=5126, target=None, mins=None, maxs=None):
        nonlocal buf
        while len(buf)%4:buf.append(0)
        offset=len(buf)
        if component==5126: raw=np.asarray(data,dtype='<f4').tobytes()
        elif component==5123:raw=np.asarray(data,dtype='<u2').tobytes()
        else:raw=np.asarray(data,dtype='<u4').tobytes()
        buf.extend(raw); bv={'buffer':0,'byteOffset':offset,'byteLength':len(raw)}
        if target:bv['target']=target
        views.append(bv)
        count=len(data)
        a={'bufferView':len(views)-1,'componentType':component,'count':count,'type':typ}
        if mins is not None:a['min']=mins;a['max']=maxs
        access.append(a);return len(access)-1
    # Node hierarchy, positions relative to parents
    specs=[('Hips',-1,[0,1.02,0]),('Spine',0,[0,.16,0]),('Chest',1,[0,.32,0]),('Neck',2,[0,.25,0]),('Head',3,[0,.15,0]),('LeftUpperArm',2,[.29,.18,0]),('LeftLowerArm',5,[.0,-.31,0]),('LeftHand',6,[0,-.27,0]),('RightUpperArm',2,[-.29,.18,0]),('RightLowerArm',8,[0,-.31,0]),('RightHand',9,[0,-.27,0]),('LeftUpperLeg',0,[.13,-.09,0]),('LeftLowerLeg',11,[0,-.43,0]),('LeftFoot',12,[0,-.42,0]),('RightUpperLeg',0,[-.13,-.09,0]),('RightLowerLeg',14,[0,-.43,0]),('RightFoot',15,[0,-.42,0])]
    nodes=[{'name':n,'translation':p} for n,_,p in specs]
    for i,(_,parent,_) in enumerate(specs):
        if parent>=0:nodes[parent].setdefault('children',[]).append(i)
    world=[]
    for n,p,t in specs:
        world.append(np.array(t)+(world[p] if p>=0 else 0))
    # box geometry with skin weights, each box assigned to a joint
    pos=[]; norms=[]; joint=[]; weight=[]; indices=[]; mats=[]
    def box(center, half, j, mat):
        start=len(pos); cx,cy,cz=center; hx,hy,hz=half
        faces=[([1,0,0],[(1,-1,-1),(1,-1,1),(1,1,1),(1,1,-1)]),([-1,0,0],[(-1,-1,1),(-1,-1,-1),(-1,1,-1),(-1,1,1)]),([0,1,0],[(-1,1,-1),(1,1,-1),(1,1,1),(-1,1,1)]),([0,-1,0],[(-1,-1,1),(1,-1,1),(1,-1,-1),(-1,-1,-1)]),([0,0,1],[(1,-1,1),(-1,-1,1),(-1,1,1),(1,1,1)]),([0,0,-1],[(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1)])]
        for normal,corners in faces:
            st=len(pos)
            for x,y,z in corners:
                pt=[cx+x*hx,cy+y*hy,cz+z*hz]
                pos.append(pt);norms.append(normal);joint.append([j,0,0,0]);weight.append([1,0,0,0])
            indices.extend([st,st+1,st+2,st,st+2,st+3]);mats.extend([mat]*6)
    # geometry in model-space, weighted to joints
    shirt=1 if outfit_idx%2==0 else 2
    pants=3; skin=0; hair=4; shoes=5
    box([0,1.42,0],[.245,.30,.135],2,shirt)
    box([0,1.02,0],[.225,.16,.13],0,pants)
    box([0,1.80,0],[.145,.19,.14],4,skin)
    box([0,1.974,0],[.155,.07,.15],4,hair)
    for side,upper,lower,hand in [(1,5,6,7),(-1,8,9,10)]:
        x=side*.33
        box([x,1.36,0],[.095,.19,.095],upper,shirt)
        box([x,1.07,0],[.078,.155,.078],lower,skin)
        box([x,.85,0],[.085,.09,.085],hand,skin)
    for side,upper,lower,foot in [(1,11,12,13),(-1,14,15,16)]:
        x=side*.13
        box([x,.75,0],[.115,.24,.115],upper,pants)
        box([x,.33,0],[.10,.235,.10],lower,pants)
        box([x,.085,.08],[.12,.085,.20],foot,shoes)
    # per material primitives
    pacc=add(pos,'VEC3',mins=np.min(pos,axis=0).tolist(),maxs=np.max(pos,axis=0).tolist())
    nacc=add(norms,'VEC3');jacc=add(joint,'VEC4',5123);wacc=add(weight,'VEC4')
    primitives=[]
    for mat in sorted(set(mats)):
        ind=[indices[i] for i,m in enumerate(mats) if m==mat]
        ia=add(ind,'SCALAR',5123,target=34963)
        primitives.append({'attributes':{'POSITION':pacc,'NORMAL':nacc,'JOINTS_0':jacc,'WEIGHTS_0':wacc},'indices':ia,'material':mat,'mode':4})
    # inverse bind matrix translations - world joint positions
    ib=[]
    for w in world:
        m=np.eye(4,dtype=np.float32);m[:3,3]=-w;ib.append(m.flatten(order='F').tolist())
    ibacc=add(ib,'MAT4')
    nodes.append({'name':'SkinnedCharacter','mesh':0,'skin':0})
    # animation channels on joints; quaternion around X axis
    def quat(angle):return [math.sin(angle/2),0,0,math.cos(angle/2)]
    animations=[]
    for name,duration,frames,amplitude in [('Idle',2.,[0,.5,1,1.5,2],.035),('Walk',.8,[0,.2,.4,.6,.8],.50),('Run',.55,[0,.1375,.275,.4125,.55],.82),('Wave',1.2,[0,.3,.6,.9,1.2],.7),('Sit',1.,[0,.25,.5,.75,1.],.8),('Sleep',2.,[0,.5,1,1.5,2.],.06),('Dance',1.,[0,.25,.5,.75,1.],.9)]:
        ts=add([[t] for t in frames],'SCALAR',mins=[0],maxs=[duration])
        channels=[];samplers=[]
        targets=([5,8,11,14] if name!='Idle' else [2,5,8])
        for jointid in targets:
            angles=[]
            for t in frames:
                phase=2*math.pi*t/duration
                if name=='Idle': a=amplitude*math.sin(phase)
                else:
                    sign=1 if jointid in (5,14) else -1
                    a=sign*amplitude*math.sin(phase)
                angles.append(quat(a))
            output=add(angles,'VEC4')
            samplers.append({'input':ts,'output':output,'interpolation':'LINEAR'})
            channels.append({'sampler':len(samplers)-1,'target':{'node':jointid,'path':'rotation'}})
        animations.append({'name':name,'samplers':samplers,'channels':channels})
    skin_tones=[[.92,.72,.56,1],[.77,.53,.36,1],[.59,.36,.24,1],[.39,.22,.15,1],[.26,.14,.10,1],[.97,.83,.71,1]]
    shirts=[[.95,.39,.30,1],[.18,.49,.85,1],[.83,.65,.20,1],[.42,.28,.65,1]]
    colors=[skin_tones[skin_idx],shirts[outfit_idx],shirts[(outfit_idx+1)%4],[.10+.07*outfit_idx,.17,.27,1],[.09+.06*(idx%3),.07,.06,1],[.87,.86,.81,1]]
    materials=[{'name':name,'pbrMetallicRoughness':{'baseColorFactor':c,'metallicFactor':0,'roughnessFactor':.85},'doubleSided':True} for name,c in zip(['Skin','Coral Shirt','Teal Shirt','Pants','Hair','Shoes'],colors)]
    gltf={'asset':{'version':'2.0','generator':'ChatGPT starter humanoid asset builder'},'scene':0,'scenes':[{'nodes':[0,17]}],'nodes':nodes,'meshes':[{'name':'HumanoidMesh','primitives':primitives}],'skins':[{'name':'HumanoidRig','joints':list(range(len(specs))),'skeleton':0,'inverseBindMatrices':ibacc}],'animations':animations,'materials':materials,'buffers':[{'byteLength':len(buf)}],'bufferViews':views,'accessors':access}
    j=json.dumps(gltf,separators=(',',':')).encode();j+=b' ' * ((-len(j))%4)
    buf+=b'\0'*((-len(buf))%4)
    glb=struct.pack('<4sII',b'glTF',2,12+8+len(j)+8+len(buf))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(buf),b'BIN\0')+buf
    path=os.path.join(OUT,'humanoid_'+variant+'.glb');open(path,'wb').write(glb)
    print(path,len(glb))
for i in range(24):make(f'citizen_{i+1:02d}')
